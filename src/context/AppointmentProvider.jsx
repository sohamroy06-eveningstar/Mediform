import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import AppointmentContext from "./appointmentContext.js";

import {
  createAppointment as createAppointmentApi,
  fetchAppointments,
  updateAppointment as updateAppointmentApi,
  deleteAppointment as deleteAppointmentApi,
} from "../service/appointmentService.js";

import { supabase } from "../lib/supabaseClient.js";

/*
 * =========================================================
 * APPOINTMENT MEMORY CACHE
 * =========================================================
 *
 * Important:
 * - In-memory only
 * - Not localStorage
 * - Not sessionStorage
 * - Keyed by authenticated user + scope
 *
 * Example:
 *
 * patient:user-id
 * admin:user-id
 */
const appointmentCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function createCacheKey(
  userId,
  adminMode,
) {
  return `${adminMode ? "admin" : "patient"}:${userId}`;
}

function getCachedEntry(cacheKey) {
  return appointmentCache.get(
    cacheKey,
  );
}

function setCachedEntry(
  cacheKey,
  data,
) {
  appointmentCache.set(
    cacheKey,
    {
      data,
      timestamp: Date.now(),
    },
  );
}

function updateCachedAppointments(
  cacheKey,
  updater,
) {
  const cached =
    appointmentCache.get(
      cacheKey,
    );

  if (!cached) {
    return;
  }

  const updatedData =
    updater(cached.data);

  appointmentCache.set(
    cacheKey,
    {
      data: updatedData,
      timestamp: Date.now(),
    },
  );
}

function isCacheFresh(cached) {
  if (!cached) {
    return false;
  }

  return (
    Date.now() -
      cached.timestamp <
    CACHE_TTL
  );
}

function isCacheStale(cached) {
  return (
    cached &&
    Date.now() -
      cached.timestamp >=
      CACHE_TTL
  );
}

function getSortedAppointments(
  data,
) {
  return [...data].sort(
    (a, b) => {
      const dateA =
        new Date(
          `${a.date || ""}T${
            a.time || "00:00"
          }`,
        ).getTime();

      const dateB =
        new Date(
          `${b.date || ""}T${
            b.time || "00:00"
          }`,
        ).getTime();

      return dateA - dateB;
    },
  );
}

function AppointmentProvider({
  children,
  adminMode = false,
}) {
  const [appointments, setAppointments] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Current authenticated user's cache key.
   *
   * Example:
   * patient:abc
   * admin:abc
   */
  const cacheKeyRef = useRef(null);

  /*
   * Prevent overlapping requests.
   */
  const requestInFlightRef =
    useRef(false);

  /*
   * =========================================================
   * GET CURRENT USER CACHE KEY
   * =========================================================
   */
  const getCurrentCacheKey =
    useCallback(async () => {
      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.user?.id
      ) {
        return null;
      }

      return createCacheKey(
        session.user.id,
        adminMode,
      );
    }, [adminMode]);

  /*
   * =========================================================
   * LOAD APPOINTMENTS
   * =========================================================
   *
   * allowLoadingState:
   *
   * true  → show page loader
   * false → background refresh
   */
  const loadAppointments =
    useCallback(
      async ({
        allowLoadingState = true,
        force = false,
      } = {}) => {
        if (requestInFlightRef.current) {
          return;
        }

        try {
          const cacheKey =
            await getCurrentCacheKey();

          if (!cacheKey) {
            if (allowLoadingState) {
              setAppointments([]);
              setIsLoading(false);
            }

            setError(
              "Authentication session not found.",
            );

            return;
          }

          cacheKeyRef.current =
            cacheKey;

          const cached =
            getCachedEntry(
              cacheKey,
            );

          /*
           * =================================================
           * CACHE HIT
           * =================================================
           */
          if (cached && !force) {
            setAppointments(
              cached.data,
            );

            /*
             * Fresh cache:
             * no API request required.
             */
            if (isCacheFresh(cached)) {
              setIsLoading(false);
              return;
            }

            /*
             * Stale cache:
             * show old data immediately,
             * refresh silently in background.
             */
            setIsLoading(false);
          } else if (
            allowLoadingState
          ) {
            setIsLoading(true);
          }

          setError("");

          /*
           * =================================================
           * API REQUEST
           * =================================================
           */
          requestInFlightRef.current =
            true;

          const response =
            await fetchAppointments({
              all: adminMode,
            });

          const nextAppointments =
            getSortedAppointments(
              response.data || [],
            );

          /*
           * Save latest data in memory.
           */
          setCachedEntry(
            cacheKey,
            nextAppointments,
          );

          setAppointments(
            nextAppointments,
          );

          setError("");
        } catch (error) {
          console.error(
            "Failed to load appointments:",
            error,
          );

          /*
           * If stale cached data exists,
           * keep showing it instead of replacing
           * the UI with an error screen.
           */
          const cacheKey =
            cacheKeyRef.current;

          const cached =
            cacheKey
              ? getCachedEntry(
                  cacheKey,
                )
              : null;

          if (
            cached?.data?.length
          ) {
            setAppointments(
              cached.data,
            );

            console.warn(
              "Using cached appointments because refresh failed.",
            );
          } else {
            setAppointments([]);

            setError(
              error.message ||
                "Unable to load appointments.",
            );
          }
        } finally {
          requestInFlightRef.current =
            false;

          setIsLoading(false);
        }
      },
      [
        adminMode,
        getCurrentCacheKey,
      ],
    );

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!mounted) {
        return;
      }

      await loadAppointments({
        allowLoadingState: true,
        force: false,
      });
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadAppointments]);

  /*
   * =========================================================
   * TAB VISIBILITY REFRESH
   * =========================================================
   *
   * Returning to browser tab does NOT automatically mean
   * API request.
   *
   * It only refreshes when cache is stale.
   */
  useEffect(() => {
    async function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      const cacheKey =
        cacheKeyRef.current;

      if (!cacheKey) {
        return;
      }

      const cached =
        getCachedEntry(cacheKey);

      /*
       * Fresh cache:
       * do nothing.
       */
      if (!isCacheStale(cached)) {
        return;
      }

      /*
       * Stale cache:
       * background refresh.
       */
      await loadAppointments({
        allowLoadingState: false,
        force: true,
      });
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadAppointments]);

  /*
   * =========================================================
   * ADD APPOINTMENT
   * =========================================================
   */
  async function addAppointment(
    appointment,
  ) {
    const response =
      await createAppointmentApi(
        appointment,
      );

    const createdAppointment =
      response.data;

    setAppointments(
      (current) => {
        const updated = [
          ...current,
          createdAppointment,
        ];

        const sorted =
          getSortedAppointments(
            updated,
          );

        const cacheKey =
          cacheKeyRef.current;

        if (cacheKey) {
          setCachedEntry(
            cacheKey,
            sorted,
          );
        }

        return sorted;
      },
    );

    return createdAppointment;
  }

  /*
   * =========================================================
   * UPDATE APPOINTMENT
   * =========================================================
   */
  async function updateAppointment(
    updatedAppointment,
  ) {
    const response =
      await updateAppointmentApi(
        updatedAppointment.id,
        updatedAppointment,
      );

    const updatedAppointmentData =
      response.data;

    setAppointments(
      (current) => {
        const updated =
          current.map(
            (appointment) =>
              appointment.id ===
              updatedAppointment.id
                ? updatedAppointmentData
                : appointment,
          );

        const sorted =
          getSortedAppointments(
            updated,
          );

        const cacheKey =
          cacheKeyRef.current;

        if (cacheKey) {
          setCachedEntry(
            cacheKey,
            sorted,
          );
        }

        return sorted;
      },
    );

    return updatedAppointmentData;
  }

  /*
   * =========================================================
   * CANCEL APPOINTMENT
   * =========================================================
   */
  async function cancelAppointment(
    appointmentId,
  ) {
    await deleteAppointmentApi(
      appointmentId,
    );

    setAppointments(
      (current) => {
        const updated =
          current.filter(
            (appointment) =>
              appointment.id !==
              appointmentId,
          );

        const cacheKey =
          cacheKeyRef.current;

        if (cacheKey) {
          setCachedEntry(
            cacheKey,
            updated,
          );
        }

        return updated;
      },
    );
  }

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        setAppointments,
        isLoading,
        error,
        addAppointment,
        updateAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export default AppointmentProvider;